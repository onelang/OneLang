use strict;
use warnings;

use one;

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
    my $str = "A x B x C x D";
    my $result = One::str_replace($str, "x", "y");
    print(("R: @{[$result]}, O: @{[$str]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}