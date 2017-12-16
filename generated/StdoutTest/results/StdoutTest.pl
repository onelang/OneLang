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

sub reverseString {
    my ( $self, $str ) = @_;
    my $result = "";
    for (my $i = length($str) - 1; $i >= 0; $i--) {
        $result .= (substr $str, $i, 1);
    }
    return $result;
}

sub testMethod {
    my ( $self ) = @_;
    print(($self->reverseString("print value")) . "\n");
    return "return value";
}

package Program;

eval {
    my $c = new TestClass();
    $c->testMethod();
};
if ($@) {
    print "Exception: " . $@
}