use strict;
use warnings;

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $constant_arr = [5];
    
    my $mutable_arr = [1];
    push @{$mutable_arr}, 2;
    
    print(("len1: @{[scalar(@{$constant_arr})]}, len2: @{[scalar(@{$mutable_arr})]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}